package com.Delivery.SkyLink.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "Shipments")
@Data
public class Shipment {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  @Column(name = "[ShipmentID]")
  private UUID shipmentId;

  @Column(name = "[Label]")
  private String label;

  @Column(name = "[CurrentHub]")
  private String currentHub;

  @Column(name = "[DestinationHub]")
  private String destinationHub;

  @Column(name = "[Status]")
  private String status;

  @Column(name = "[ProgressPercent]")
  private Integer progressPercent;

  @Column(name = "[CurrentLat]")
  private Double currentLat;

  @Column(name = "[CurrentLng]")
  private Double currentLng;

  @Column(name = "[RoutePathJson]")
  private String routePathJson;

  @Column(name = "[CreatedAt]")
  private LocalDateTime createdAt = LocalDateTime.now();

  @Column(name = "[consumer_name]")
  private String consumerName;

  @Column(name = "[delivery_address]")
  private String deliveryAddress;

  @Column(name = "[container_id]")
  private String containerId;
}
