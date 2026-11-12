package com.remont.back_end.repository;

import com.remont.back_end.model.Client;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    
    List<Client> findAllByActiveTrue();

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Client c set c.active = false where c.id = :id")
    void deactivateById(Long id);

    boolean existsByCpf(String cpf);
    
    boolean existsByEmail(String email);

    Optional<Client> findByEmail(String email);
}