package com.fyp.integration.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class AiChatbotService {
  private static final String SYSTEM_PROMPT = """
      You are an academic thesis assistant for a Final Year Project portal.
      Help both students and advisors with concise, practical guidance on:
      - research planning
      - thesis structure
      - methodology choices
      - writing clarity
      - milestones and deadlines
      Keep answers clear, accurate, and actionable.
      """;

  private final String apiKey;
  private final String model;
  private final RestTemplate restTemplate;

  public AiChatbotService(
      @Value("${gemini.api-key}") String apiKey,
      @Value("${gemini.model:gemini-1.5-flash}") String model) {
    this.apiKey = apiKey;
    this.model = model;
    this.restTemplate = new RestTemplate();
  }

  public ChatResult chat(String message) {
    if (apiKey == null || apiKey.isBlank() || apiKey.equals("YOUR_GEMINI_API_KEY_HERE")) {
      return new ChatResult(
          "AI provider is not configured yet. Get a FREE API key from https://aistudio.google.com/apikey and set gemini.api-key in application.properties, then restart.",
          true
      );
    }

    try {
      String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

      // Build request body
      Map<String, Object> requestBody = new HashMap<>();
      
      // System instruction
      Map<String, Object> systemInstruction = new HashMap<>();
      Map<String, String> systemPart = new HashMap<>();
      systemPart.put("text", SYSTEM_PROMPT);
      systemInstruction.put("parts", List.of(systemPart));
      requestBody.put("systemInstruction", systemInstruction);
      
      // User message
      Map<String, Object> content = new HashMap<>();
      content.put("role", "user");
      Map<String, String> part = new HashMap<>();
      part.put("text", message);
      content.put("parts", List.of(part));
      requestBody.put("contents", List.of(content));

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);

      HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
      ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

      // Extract response text
      Map body = response.getBody();
      if (body != null && body.containsKey("candidates")) {
        List<Map> candidates = (List<Map>) body.get("candidates");
        if (!candidates.isEmpty()) {
          Map candidate = candidates.get(0);
          Map contentResp = (Map) candidate.get("content");
          List<Map> parts = (List<Map>) contentResp.get("parts");
          if (!parts.isEmpty()) {
            String reply = (String) parts.get(0).get("text");
            return new ChatResult(reply, false);
          }
        }
      }

      return new ChatResult("I could not generate a response right now. Please try again.", true);
    } catch (Exception e) {
      System.err.println("AI Chat Error: " + e.getMessage());
      e.printStackTrace();
      return new ChatResult(
          "AI service is temporarily unavailable. Error: " + e.getMessage(),
          true
      );
    }
  }

  public record ChatResult(String reply, boolean fallback) {}
}
