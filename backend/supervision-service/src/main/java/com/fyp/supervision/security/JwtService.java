package com.fyp.supervision.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {
  private final SecretKey secretKey;
  private final long expirationTime;

  public JwtService(
      @Value("${security.jwt.secret:mySecretKeyForTokenGenerationAndValidation12345}") String secret,
      @Value("${security.jwt.expiration:86400000}") long expiration) {
    this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
    this.expirationTime = expiration;
  }

  public String generateToken(String username, String role) {
    return Jwts.builder()
        .setSubject(username)
        .claim("role", role.startsWith("ROLE_") ? role : "ROLE_" + role)
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
        .signWith(secretKey, SignatureAlgorithm.HS256)
        .compact();
  }

  public String extractUsername(String token) {
    return getClaims(token).getSubject();
  }

  public String extractRole(String token) {
    Object roleClaim = getClaims(token).get("role");
    if (roleClaim instanceof List<?> rolesList) {
      // Auth-service stores roles as a List
      if (!rolesList.isEmpty()) {
        Object firstRole = rolesList.get(0);
        if (firstRole != null) {
          return firstRole.toString();
        }
      }
      return null;
    } else if (roleClaim instanceof String roleStr) {
      return roleStr;
    }
    return null;
  }

  public boolean isTokenValid(String token) {
    try {
      getClaims(token);
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  private Claims getClaims(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(secretKey)
        .build()
        .parseClaimsJws(token)
        .getBody();
  }
}


