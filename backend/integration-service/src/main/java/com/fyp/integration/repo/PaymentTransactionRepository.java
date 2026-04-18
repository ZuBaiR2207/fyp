package com.fyp.integration.repo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fyp.integration.model.PaymentTransaction;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
  List<PaymentTransaction> findAllByOrderByCreatedAtDesc();
  List<PaymentTransaction> findByUsernameOrderByCreatedAtDesc(String username);
  Optional<PaymentTransaction> findByStripeSessionId(String stripeSessionId);
}
