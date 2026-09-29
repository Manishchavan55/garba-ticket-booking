package com.garba.ticketbooking.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "customers", indexes = {
        @Index(name = "idx_customers_mobile", columnList = "mobile"),
        @Index(name = "idx_customers_email", columnList = "email")
})
public class Customer extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 32)
    private String mobile;

    @Column(length = 254)
    private String email;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
