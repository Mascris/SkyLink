package com.Delivery.SkyLink.service;

import com.Delivery.SkyLink.model.Hub;
import com.Delivery.SkyLink.model.Shipment;
import com.Delivery.SkyLink.model.Consumer;

import com.Delivery.SkyLink.repository.HubRepository;
import com.Delivery.SkyLink.repository.ShipmentRepository;
import com.Delivery.SkyLink.repository.ConsumerRepository;

import net.datafaker.Faker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Random;

@Service
@Slf4j
@RequiredArgsConstructor
public class SimulationService {

  private final HubRepository hubRepository;
  private final ShipmentRepository shipmentRepository;
  private final ConsumerRepository consumerRepository;
  private final PathfinderService pathfinderService;

  private final Faker faker = new Faker();
  private final Random random = new Random();

  @Scheduled(fixedRate = 8000)
  public void generateOrder() {
    List<Hub> hubs = hubRepository.findAll();
    List<Consumer> customers = consumerRepository.findAll();

    if (hubs.size() < 2 || customers.isEmpty()) {
      log.warn("⏳ Skipping order: Waiting for Hubs and at least one Consumer to exist...");
      return;
    }

    // Don't exceed too many active shipments (Increased limit)
    /*
    long activeCount = shipmentRepository.count();
    if (activeCount > 10000) {
      log.info("📦 Skipping order: {} shipments active, waiting for deliveries.", activeCount);
      return;
    }
    */

    Collections.shuffle(hubs);
    Hub origin = hubs.get(0);
    Hub destination = hubs.get(1);

    // Compute route through hub connections
    List<String> routePath = pathfinderService.findPath(origin.getHubCode(), destination.getHubCode());
    // Format as JSON array for DB constraint: ["SHA","SIN"]
    String routePathJson = "[\"" + String.join("\",\"", routePath) + "\"]";

    Shipment shipment = new Shipment();

    Consumer buyer = customers.get(random.nextInt(customers.size()));
    shipment.setConsumerName(buyer.getFirstName() + " " + buyer.getLastName());
    shipment.setDeliveryAddress(buyer.getDefaultAddress());

    shipment.setLabel(faker.commerce().productName());
    shipment.setCurrentHub(origin.getHubCode());
    shipment.setDestinationHub(destination.getHubCode());
    shipment.setStatus("IN_QUEUE");
    shipment.setProgressPercent(0);
    shipment.setCurrentLat(origin.getLatitude());
    shipment.setCurrentLng(origin.getLongtitude());
    shipment.setContainerId(faker.regexify("CONT-[0-9]{8}"));
    shipment.setRoutePathJson(routePathJson);

    shipmentRepository.save(shipment);

    log.info("📦 NEW ORDER: [{}] {} → {} (route: {}) assigned to {}",
        shipment.getLabel(), origin.getHubCode(), destination.getHubCode(),
        routePathJson, shipment.getConsumerName());
  }

  @Scheduled(fixedRate = 30000)
  public void createNewConsumer() {

    long count = consumerRepository.count();
    if (count < 1000) { // Increased from 150
      Consumer c = new Consumer();
      c.setFirstName(faker.name().firstName());
      c.setLastName(faker.name().lastName());
      c.setEmail(faker.internet().emailAddress());
      c.setPhone(faker.phoneNumber().cellPhone());
      c.setDefaultAddress(faker.address().fullAddress());

      consumerRepository.save(c);
      log.info("👤 NEW CUSTOMER REGISTERED: {} {}", c.getFirstName(), c.getLastName());
    }
  }

}
