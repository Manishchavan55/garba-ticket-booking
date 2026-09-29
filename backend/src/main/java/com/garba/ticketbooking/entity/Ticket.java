package com.garba.ticketbooking.entity;

import com.garba.ticketbooking.entity.enums.QrStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tickets", indexes = {
        @Index(name = "idx_tickets_booking", columnList = "booking_id"),
        @Index(name = "idx_tickets_booking_item", columnList = "booking_item_id"),
        @Index(name = "idx_tickets_status", columnList = "qr_status")
})
public class Ticket extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_item_id", nullable = false)
    private BookingItem bookingItem;

    @Column(name = "qr_token", nullable = false, unique = true, length = 128)
    private String qrToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "qr_status", nullable = false, length = 24)
    private QrStatus qrStatus;

    @Column(name = "issued_at")
    private Instant issuedAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @OneToMany(mappedBy = "ticket", fetch = FetchType.LAZY)
    private List<EntryScan> entryScans = new ArrayList<>();

    public Long getId() { return id; }
    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }
    public BookingItem getBookingItem() { return bookingItem; }
    public void setBookingItem(BookingItem bookingItem) { this.bookingItem = bookingItem; }
    public String getQrToken() { return qrToken; }
    public void setQrToken(String qrToken) { this.qrToken = qrToken; }
    public QrStatus getQrStatus() { return qrStatus; }
    public void setQrStatus(QrStatus qrStatus) { this.qrStatus = qrStatus; }
    public Instant getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }
    public Instant getUsedAt() { return usedAt; }
    public void setUsedAt(Instant usedAt) { this.usedAt = usedAt; }
    public List<EntryScan> getEntryScans() { return entryScans; }
}
