package com.garba.ticketbooking.entity;

import com.garba.ticketbooking.entity.enums.EntryScanResult;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "entry_scans", indexes = {
        @Index(name = "idx_entry_scans_ticket", columnList = "ticket_id"),
        @Index(name = "idx_entry_scans_scanned_at", columnList = "scanned_at"),
        @Index(name = "idx_entry_scans_scanner", columnList = "scanner_id"),
        @Index(name = "idx_entry_scans_result", columnList = "result")
})
public class EntryScan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(name = "scanned_at", nullable = false)
    private Instant scannedAt;

    @Column(name = "scanner_id", length = 100)
    private String scannerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private EntryScanResult result;

    @PrePersist
    protected void onCreate() {
        if (scannedAt == null) {
            scannedAt = Instant.now();
        }
    }

    public Long getId() { return id; }
    public Ticket getTicket() { return ticket; }
    public void setTicket(Ticket ticket) { this.ticket = ticket; }
    public Instant getScannedAt() { return scannedAt; }
    public void setScannedAt(Instant scannedAt) { this.scannedAt = scannedAt; }
    public String getScannerId() { return scannerId; }
    public void setScannerId(String scannerId) { this.scannerId = scannerId; }
    public EntryScanResult getResult() { return result; }
    public void setResult(EntryScanResult result) { this.result = result; }
}
