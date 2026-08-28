package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.InteresRed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InteresRedRepository extends JpaRepository<InteresRed, Integer> {
}
