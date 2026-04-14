package com.fyp.integration.controller;

import java.time.Instant;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fyp.integration.service.AiChatbotService;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {
  private final AiChatbotService aiChatbotService;

  public AiChatController(AiChatbotService aiChatbotService) {
    this.aiChatbotService = aiChatbotService;
  }

  @PostMapping("/chat")
  public ChatResponse chat(@RequestBody ChatRequest request) {
    String message = request.message() == null ? "" : request.message().trim();
    if (message.isBlank()) {
      return new ChatResponse(
          "Please write a question so I can help.",
          true,
          "none",
          Instant.now()
      );
    }

    AiChatbotService.ChatResult result = aiChatbotService.chat(message);
    return new ChatResponse(
        result.reply(),
        result.fallback(),
      result.fallback() ? "none" : "spring-ai-anthropic",
        Instant.now()
    );
  }

  public record ChatRequest(String message) {}

  public record ChatResponse(
      String reply,
      boolean fallback,
      String provider,
      Instant timestamp
  ) {}
}
