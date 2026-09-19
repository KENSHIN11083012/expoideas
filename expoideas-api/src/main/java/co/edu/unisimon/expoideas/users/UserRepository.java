package co.edu.unisimon.expoideas.users;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    @EntityGraph(User.WITH_PROFILE)
    Optional<User> findWithProfileById(Integer id);

    @EntityGraph(User.WITH_PROFILE)
    Optional<User> findWithProfileByEmail(String email);

    @EntityGraph(User.WITH_PROFILE)
    List<User> findAllWithProfileBy();
}
