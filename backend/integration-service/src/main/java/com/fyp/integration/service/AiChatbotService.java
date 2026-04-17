package com.fyp.integration.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

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

  private final ChatClient chatClient;

  public AiChatbotService(ChatClient.Builder chatClientBuilder) {
    this.chatClient = chatClientBuilder
        .defaultSystem(SYSTEM_PROMPT)
        .build();
  }

  public ChatResult chat(String message) {
    try {
      String reply = chatClient.prompt()
          .user(message)
          .call()
          .content();

      if (reply == null || reply.isBlank()) {
        return new ChatResult("I could not generate a response right now. Please try again.", true);
      }

      return new ChatResult(reply, false);
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
