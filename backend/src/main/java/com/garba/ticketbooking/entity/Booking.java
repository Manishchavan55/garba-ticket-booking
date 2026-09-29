package com.garba.ticketbooking.entity;

import com.garba.ticketbooking.entity.enums.BookingStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings", indexes = {
        @Index(name = "idx_bookings_customer", columnList = "customer_id"),
        @Index(name = "idx_bookings_status", columnList = "booking_status"),
        @Index(name = "idx_bookings_created_at", columnList = "created_at")
})
public class Booking extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_reference", nullable = false, unique = true, length = 40)
    private String bookingReference;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_status", nullable = false, length = 32)
    private BookingStatus bookingStatus;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY)
    private List<BookingItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY)
    private List<Payment> payments = new ArrayList<>();

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY)
    private List<Ticket> tickets = new ArrayList<>();

    public Long getId() { return id; }
    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public BookingStatus getBookingStatus() { return bookingStatus; }
    public void setBookingStatus(BookingStatus bookingStatus) { this.bookingStatus = bookingStatus; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public List<BookingItem> getItems() { return items; }
    public List<Payment> getPayments() { return payments; }
    public List<Ticket> getTickets() { return tickets; }
}
