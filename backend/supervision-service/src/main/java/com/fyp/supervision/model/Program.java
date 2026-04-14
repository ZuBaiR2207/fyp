package com.fyp.supervision.model;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "programs")
public class Program {
  @Id
  @UuidGenerator
  @Column(name = "id", updatable = false, nullable = false)
  private String id;

  @Column(name = "name", nullable = false, unique = true)
  private String name;

  public String getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }
}

