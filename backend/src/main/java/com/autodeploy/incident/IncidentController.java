package com.autodeploy.incident;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api")
public class IncidentController {
    private final IncidentRepository repository;

    public IncidentController(IncidentRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/incidents")
    public List<Incident> getAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/incidents")
    @ResponseStatus(HttpStatus.CREATED)
    public Incident create(@Valid @RequestBody Incident incident) {
        incident.setId(null);
        return repository.save(incident);
    }

    @GetMapping("/incidents/{id}")
    public Incident getOne(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));
    }

    @PutMapping("/incidents/{id}")
    public Incident update(@PathVariable Long id, @Valid @RequestBody Incident incoming) {
        Incident current = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));
        current.setTitle(incoming.getTitle());
        current.setDescription(incoming.getDescription());
        current.setSeverity(incoming.getSeverity());
        current.setStatus(incoming.getStatus());
        current.setAssignedTo(incoming.getAssignedTo());
        return repository.save(current);
    }

    @DeleteMapping("/incidents/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found");
        }
        repository.deleteById(id);
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "incident-backend");
    }
}
