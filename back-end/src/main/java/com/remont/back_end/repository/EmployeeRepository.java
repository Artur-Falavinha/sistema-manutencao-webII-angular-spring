package com.remont.back_end.repository;

import com.remont.back_end.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    List<Employee> findAllByActiveTrue();

    long countByActiveTrue();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Employee e where e.active = true order by e.id")
    List<Employee> findActiveForUpdate();

    Optional<Employee> findByCpf(String cpf);

    Optional<Employee> findByEmail(String email);

    boolean existsByCpf(String cpf);
}