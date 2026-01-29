package com.Delivery.SkyLink.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Consumers")
@Data
public class Consumer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "[ConsumerID]")
  private Integer consumerId;

  @Column(name = "[FirstName]")
  private String firstName;

  @Column(name = "[LastName]")
  private String lastName;

  @Column(name = "[Email]")
  private String email;

  @Column(name = "[Phone]")
  private String phone;

  @Column(name = "[DefaultAddress]")
  private String defaultAddress;
}
