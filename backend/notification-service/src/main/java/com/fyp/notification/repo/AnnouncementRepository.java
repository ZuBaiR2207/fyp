package com.fyp.notification.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fyp.notification.model.Announcement;

public interface AnnouncementRepository extends JpaRepository<Announcement, String> {
  List<Announcement> findAllByOrderByPinnedDescCreatedAtDesc();
}
