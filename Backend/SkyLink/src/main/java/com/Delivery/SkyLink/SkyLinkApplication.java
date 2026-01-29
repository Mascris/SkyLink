package com.Delivery.SkyLink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class SkyLinkApplication {

  public static void main(String[] args) {
    SpringApplication.run(SkyLinkApplication.class, args);
  }

}
