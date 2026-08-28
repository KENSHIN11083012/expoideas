package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.ConvocatoriaKeyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConvocatoriaKeywordRepository extends JpaRepository<ConvocatoriaKeyword, Integer> {
}
