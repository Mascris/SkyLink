package com.Delivery.SkyLink.repository;

import com.Delivery.SkyLink.model.Hub;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HubRepository extends JpaRepository<Hub, String> {

}
