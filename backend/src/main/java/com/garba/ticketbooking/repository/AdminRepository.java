package com.garba.ticketbooking.repository;

import com.garba.ticketbooking.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByEmailIgnoreCase(String email);
}
