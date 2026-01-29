package com.Delivery.SkyLink.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Hubs")
@Data
public class Hub {
  @Id
  @Column(name = "[HubCode]")
  private String hubCode;

  @Column(name = "[City]")
  private String city;

  @Column(name = "[Country]")
  private String country;

  @Column(name = "[Latitude]")
  private Double latitude;

  @Column(name = "[Longtitude]")
  private Double longtitude;

  @Column(name = "[TimeZoneOffset]")
  private Integer timeZoneOffset;
}
