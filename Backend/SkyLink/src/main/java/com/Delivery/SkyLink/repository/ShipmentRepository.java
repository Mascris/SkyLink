package com.Delivery.SkyLink.repository;

import com.Delivery.SkyLink.model.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {
  List<Shipment> findByStatus(String status);
}
