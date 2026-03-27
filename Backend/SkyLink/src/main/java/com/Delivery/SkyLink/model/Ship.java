package com.Delivery.SkyLink.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Ships")
@Data
public class Ship {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "[ShipID]")
  private Integer shipId;

  @Column(name = "[Name]")
  private String name;

  @Column(name = "[VesselType]")
  private String vesselType;

  @Column(name = "[SpeedFactor]")
  private Integer speedFactor;
}
