package com.Delivery.SkyLink.repository;

import com.Delivery.SkyLink.model.HubConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HubConnectionRepository extends JpaRepository<HubConnection, Integer> {

}
