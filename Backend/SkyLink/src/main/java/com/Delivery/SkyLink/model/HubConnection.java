package com.Delivery.SkyLink.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "[HubConnections]")
@Data
public class HubConnection {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "[id]")
  private Integer id;

  @Column(name = "[FromHub]")
  private String fromHub;

  @Column(name = "[ToHub]")
  private String toHub;

  @Column(name = "[Weight]")
  private Integer weight;
}
