package com.fyp.integration.service;

import org.springframework.beans.factory.ObjectProvider;
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

  public AiChatbotService(ObjectProvider<ChatClient.Builder> builderProvider) {
    ChatClient.Builder builder = builderProvider.getIfAvailable();
    this.chatClient = builder == null ? null : builder.defaultSystem(SYSTEM_PROMPT).build();
  }

  public ChatResult chat(String message) {
    if (chatClient == null) {
      return new ChatResult(
          "AI provider is not configured yet. Set ANTHROPIC_API_KEY (or spring.ai.anthropic.api-key) in integration-service, then restart.",
          true
      );
    }

    try {
      String reply = chatClient.prompt()
          .user(message)
          .call()
          .content();

      if (reply == null || reply.isBlank()) {
        reply = "I could not generate a response right now. Please try again.";
      }

      return new ChatResult(reply, false);
    } catch (Exception e) {
      // Log the error and return a fallback response
      System.err.println("AI Chat Error: " + e.getMessage());
      return new ChatResult(
          "AI service is temporarily unavailable. Please check your API key or try again later. Error: " + e.getMessage(),
          true
      );
    }
  }

  public record ChatResult(String reply, boolean fallback) {}
}
