package com.fyp.integration.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

@RestController
@RequestMapping("/api/integrations")
public class IntegrationsController {
  private static final Pattern SENTENCE_SPLIT = Pattern.compile("(?<=[.!?])\\s+");
  private final RestClient openLibraryClient;
  private final String stripeSecretKey;
  private final String stripeSuccessUrl;
  private final String stripeCancelUrl;

  public IntegrationsController(
      @Value("${integrations.open-library.base-url:https://openlibrary.org}") String openLibraryBaseUrl,
      @Value("${stripe.secret-key:}") String stripeSecretKey,
      @Value("${stripe.success-url:http://localhost:5174/?payment=success}") String stripeSuccessUrl,
      @Value("${stripe.cancel-url:http://localhost:5174/?payment=cancel}") String stripeCancelUrl
  ) {
    this.openLibraryClient = RestClient.builder()
        .baseUrl(openLibraryBaseUrl)
        .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
        .build();
    this.stripeSecretKey = stripeSecretKey;
    this.stripeSuccessUrl = stripeSuccessUrl;
    this.stripeCancelUrl = stripeCancelUrl;
    if (stripeSecretKey != null && !stripeSecretKey.isBlank()) {
      Stripe.apiKey = stripeSecretKey;
    }
  }

  @GetMapping("/academic")
  public List<AcademicRecord> academic(@RequestParam(required = false) String query) {
    // MVP stub: replace with real connector logic for academic databases.
    return List.of(
        new AcademicRecord("IEEE Xplore (stub)", (query == null || query.isBlank()) ? "AI Governance" : query, "A. Author; B. Author", LocalDate.now().getYear()),
        new AcademicRecord("ACM Digital Library (stub)", (query == null || query.isBlank()) ? "Supervision Analytics" : query, "C. Researcher", LocalDate.now().getYear() - 1)
    );
  }

  @GetMapping("/funding")
  public List<FundingRecord> funding(@RequestParam(required = false) String query) {
    return List.of(
        new FundingRecord("Govt Funding Portal (stub)", 500000, LocalDate.now().plusDays(30), "Research Grant"),
        new FundingRecord("Industry Partner Portal (stub)", 250000, LocalDate.now().plusDays(45), (query == null || query.isBlank()) ? "STEM Scholarship" : ("Scholarship for " + query))
    );
  }

  @GetMapping("/library")
  public List<LibraryRecord> library(@RequestParam(required = false) String query) {
    String searchQuery = (query == null || query.isBlank()) ? "higher education project management" : query.trim();

    try {
      var responseSpec = openLibraryClient.get()
          .uri(uriBuilder -> uriBuilder.path("/search.json")
              .queryParam("q", searchQuery)
              .queryParam("limit", 8)
              .build())
          .retrieve();

      OpenLibrarySearchResponse response = responseSpec.body(OpenLibrarySearchResponse.class);

      if (response == null || response.docs() == null || response.docs().isEmpty()) {
        return fallbackLibrary(searchQuery);
      }

      return response.docs().stream()
          .filter(doc -> doc.title() != null && !doc.title().isBlank())
          .limit(8)
          .map(doc -> new LibraryRecord(
              "Open Library",
              doc.editionCount() != null && doc.editionCount() > 1 ? "Book / Editions" : "Book",
              doc.title(),
              "Open catalog record",
              doc.authorNames() == null || doc.authorNames().isEmpty() ? "Unknown author" : String.join(", ", doc.authorNames()),
              doc.firstPublishYear(),
              doc.key() == null || doc.key().isBlank() ? null : "https://openlibrary.org" + doc.key()
          ))
          .toList();
    } catch (Exception ex) {
      System.err.println("Error calling Open Library search: " + ex.getClass().getName() + " - " + ex.getMessage());
      ex.printStackTrace();
      return fallbackLibrary(searchQuery);
    }
  }

  @GetMapping("/library/isbn")
  public List<LibraryRecord> libraryByIsbn(@RequestParam String isbn) {
    if (isbn == null || isbn.isBlank()) {
      return fallbackLibrary("ISBN search");
    }

    String cleanIsbn = isbn.trim().replaceAll("[^0-9X]", "");
    if (cleanIsbn.isEmpty()) {
      return fallbackLibrary("Invalid ISBN format");
    }

    try {
      OpenLibraryBooksResponse response = openLibraryClient.get()
          .uri(uriBuilder -> uriBuilder.path("/api/books")
              .queryParam("bibkeys", "ISBN:" + cleanIsbn)
              .queryParam("format", "json")
              .queryParam("jscmd", "data")
              .build())
          .retrieve()
          .body(OpenLibraryBooksResponse.class);

      if (response == null || response.books() == null || response.books().isEmpty()) {
        return fallbackLibrary("ISBN:" + cleanIsbn);
      }

      return response.books().entrySet().stream()
          .map(entry -> {
            OpenLibraryBook book = entry.getValue();
            String authorsStr = "Unknown author";
            if (book.authors() != null && !book.authors().isEmpty()) {
              authorsStr = book.authors().stream()
                  .map(OpenLibraryAuthor::name)
                  .reduce((a, b) -> a + ", " + b)
                  .orElse("Unknown author");
            }
            Integer year = null;
            if (book.publishDate() != null && book.publishDate().contains("-")) {
              try {
                year = Integer.parseInt(book.publishDate().substring(0, 4));
              } catch (Exception e) {
                // ignore parse error
              }
            }
            return new LibraryRecord(
                "Open Library",
                "Book",
                book.title() != null ? book.title() : "Unknown title",
                "ISBN found",
                authorsStr,
                year,
                book.url() != null ? book.url() : null
            );
          })
          .toList();
    } catch (Exception ex) {
      System.err.println("Error calling Open Library ISBN lookup: " + ex.getMessage());
      ex.printStackTrace();
      return fallbackLibrary("ISBN:" + cleanIsbn);
    }
  }

  @PostMapping("/payment/create-session")
  public CheckoutSessionResponse createCheckoutSession(@RequestBody CheckoutSessionRequest request) {
    if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
      throw new IllegalStateException("Stripe secret key is not configured.");
    }

    double amount = request.amount() == null ? 0.0 : request.amount();
    long amountCents = Math.round(amount * 100);
    if (amountCents <= 0) {
      throw new IllegalArgumentException("Amount must be greater than zero.");
    }

    String currency = request.currency() == null || request.currency().isBlank() ? "myr" : request.currency().trim().toLowerCase();
    String description = request.description() == null || request.description().isBlank() ? "Student payment" : request.description().trim();

    try {
      SessionCreateParams params = SessionCreateParams.builder()
          .setMode(SessionCreateParams.Mode.PAYMENT)
          .setSuccessUrl(stripeSuccessUrl)
          .setCancelUrl(stripeCancelUrl)
          .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
          .setLocale(SessionCreateParams.Locale.EN)
          .addLineItem(SessionCreateParams.LineItem.builder()
              .setQuantity(1L)
              .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                  .setCurrency(currency)
                  .setUnitAmount(amountCents)
                  .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                      .setName(description)
                      .build())
                  .build())
              .build())
          .build();

      Session session = Session.create(params);
      return new CheckoutSessionResponse(session.getUrl(), session.getId());
    } catch (StripeException e) {
      throw new RuntimeException("Stripe checkout creation failed: " + e.getMessage(), e);
    }
  }

  private List<LibraryRecord> fallbackLibrary(String query) {
    return List.of(
        new LibraryRecord("Library fallback", "Book", query, "Catalog unavailable right now", "Unknown author", null, null),
        new LibraryRecord("Library fallback", "Journal", "Assessment & Accreditation", "Catalog unavailable right now", "Unknown author", LocalDate.now().getYear() + 1900, null)
    );
  }

  @PostMapping("/summarize")
  public SummaryResponse summarize(@RequestBody SummaryRequest request) {
    String safeTitle = request.title() == null || request.title().isBlank() ? "Untitled paper" : request.title().trim();
    String text = request.abstractText() == null ? "" : request.abstractText().trim();
    if (text.isEmpty()) {
      return new SummaryResponse(
          safeTitle,
          "No abstract text was provided to summarize.",
          0,
          "Provide an abstract or paper body to generate a better summary."
      );
    }
    int maxSentences = request.maxSentences() == null ? 3 : Math.max(1, Math.min(6, request.maxSentences()));

    String[] sentences = SENTENCE_SPLIT.split(text);
    StringBuilder builder = new StringBuilder();
    int used = 0;
    for (String sentence : sentences) {
      String trimmed = sentence.trim();
      if (trimmed.isEmpty()) {
        continue;
      }
      if (builder.length() > 0) {
        builder.append(" ");
      }
      builder.append(trimmed);
      used++;
      if (used >= maxSentences) {
        break;
      }
    }

    if (builder.isEmpty()) {
      builder.append(text);
    }

    return new SummaryResponse(
      safeTitle,
        builder.toString(),
        used == 0 ? 1 : used,
        "MVP extractive summary generated from the submitted abstract."
    );
  }

  public record AcademicRecord(String source, String title, String authors, int year) {}

  public record FundingRecord(String portal, int amount, LocalDate deadline, String type) {}

  public record LibraryRecord(
      String library,
      String itemType,
      String title,
      String availability,
      String authors,
      Integer year,
      String url
  ) {}

  public record SummaryRequest(
      String title,
      String abstractText,
      Integer maxSentences
  ) {}

  public record SummaryResponse(
      String title,
      String summary,
      int sentencesUsed,
      String note
  ) {}

  public record CheckoutSessionRequest(Double amount, String currency, String description) {}

  public record CheckoutSessionResponse(String url, String sessionId) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OpenLibrarySearchResponse(
      @JsonProperty("docs") List<OpenLibraryDoc> docs
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OpenLibraryDoc(
      String key,
      String title,
      @JsonProperty("author_name") List<String> authorNames,
      @JsonProperty("first_publish_year") Integer firstPublishYear,
      @JsonProperty("edition_count") Integer editionCount
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OpenLibraryBooksResponse(
      Map<String, OpenLibraryBook> books
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OpenLibraryBook(
      String title,
      List<OpenLibraryAuthor> authors,
      String url,
      @JsonProperty("publish_date") String publishDate
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OpenLibraryAuthor(
      String name
    ) {}
}

