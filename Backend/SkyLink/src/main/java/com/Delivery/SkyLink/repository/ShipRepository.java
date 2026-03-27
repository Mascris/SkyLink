package com.Delivery.SkyLink.repository;

import com.Delivery.SkyLink.model.Ship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShipRepository extends JpaRepository<Ship, Integer> {
}
