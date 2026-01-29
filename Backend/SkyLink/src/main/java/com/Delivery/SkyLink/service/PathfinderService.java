package com.Delivery.SkyLink.service;

import com.Delivery.SkyLink.model.HubConnection;
import com.Delivery.SkyLink.repository.HubConnectionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PathfinderService {

  private final HubConnectionRepository connectionRepository;
  private final Map<String, Map<String, Integer>> graph = new HashMap<>();

  @PostConstruct
  public void init() {
    List<HubConnection> connections = connectionRepository.findAll();
    for (HubConnection c : connections) {
      graph.computeIfAbsent(c.getFromHub(), k -> new HashMap<>()).put(c.getToHub(), c.getWeight());
      graph.computeIfAbsent(c.getToHub(), k -> new HashMap<>()).put(c.getFromHub(), c.getWeight());
    }
  }

  public List<String> findPath(String start, String end) {
    PriorityQueue<Node> pq = new PriorityQueue<>(Comparator.comparingInt(n -> n.distance));
    Map<String, Integer> distances = new HashMap<>();
    Map<String, String> parents = new HashMap<>();

    pq.add(new Node(start, 0));
    distances.put(start, 0);

    while (!pq.isEmpty()) {
      Node current = pq.poll();
      if (current.id.equals(end))
        break;

      if (graph.containsKey(current.id)) {
        for (Map.Entry<String, Integer> neighbor : graph.get(current.id).entrySet()) {
          int newDist = distances.get(current.id) + neighbor.getValue();
          if (newDist < distances.getOrDefault(neighbor.getKey(), Integer.MAX_VALUE)) {
            distances.put(neighbor.getKey(), newDist);
            parents.put(neighbor.getKey(), current.id);
            pq.add(new Node(neighbor.getKey(), newDist));
          }
        }
      }
    }

    List<String> path = new LinkedList<>();
    for (String at = end; at != null; at = parents.get(at))
      path.add(at);
    Collections.reverse(path);
    return path;
  }

  private record Node(String id, int distance) {
  }
}
