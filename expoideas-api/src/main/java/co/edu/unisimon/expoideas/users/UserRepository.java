package co.edu.unisimon.expoideas.users;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Integer> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    @EntityGraph(User.WITH_PROFILE)
    Optional<User> findWithProfileById(Integer id);

    @EntityGraph(User.WITH_PROFILE)
    Optional<User> findWithProfileByEmail(String email);

    @EntityGraph(User.WITH_PROFILE)
    List<User> findAllWithProfileBy();

    /** De esos correos, los que ya tienen cuenta (la columna no distingue mayúsculas). */
    @Query("select u.email from User u where u.email in :emails")
    List<String> findEmailsIn(@Param("emails") Collection<String> emails);
}
