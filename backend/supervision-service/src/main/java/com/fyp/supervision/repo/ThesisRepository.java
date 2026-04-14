package com.fyp.supervision.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fyp.supervision.model.Thesis;
import com.fyp.supervision.model.ThesisStatus;

@Repository
public interface ThesisRepository extends JpaRepository<Thesis, String> {
    
    /**
     * Find thesis by student username
     */
    Optional<Thesis> findByStudentUsername(String studentUsername);
    
    /**
     * Find all theses supervised by a specific supervisor
     */
    List<Thesis> findBySupervisorUsernameOrderByCreatedAtDesc(String supervisorUsername);
    
    /**
     * Find all theses by status
     */
    List<Thesis> findByStatusOrderByUpdatedAtDesc(ThesisStatus status);
    
    /**
     * Find theses by program
     */
    List<Thesis> findByProgramIdOrderByCreatedAtDesc(String programId);
    
    /**
     * Find all theses (for admin)
     */
    List<Thesis> findAllByOrderByCreatedAtDesc();
    
    /**
     * Check if student already has a thesis
     */
    boolean existsByStudentUsername(String studentUsername);
    
    /**
     * Count theses by status (for analytics)
     */
    long countByStatus(ThesisStatus status);
    
    /**
     * Find theses with progress below threshold (at-risk students)
     */
    @Query("SELECT t FROM Thesis t WHERE t.progress < :threshold AND t.status NOT IN ('COMPLETED', 'FAILED')")
    List<Thesis> findAtRiskTheses(@Param("threshold") int progressThreshold);
    
    /**
     * Search theses by title or keywords
     */
    @Query("SELECT t FROM Thesis t WHERE LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(t.keywords) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Thesis> searchByTitleOrKeywords(@Param("query") String query);
}
