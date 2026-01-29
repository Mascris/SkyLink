package com.Delivery.SkyLink.controller;

import com.Delivery.SkyLink.model.Hub;
import com.Delivery.SkyLink.repository.HubRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hub")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class HubController {

  private final HubRepository hubRepository;

  @GetMapping("/all")
  public List<Hub> getAllHubs() {
    return hubRepository.findAll();
  }
}
