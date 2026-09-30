package co.edu.unisimon.expoideas.jury;

import co.edu.unisimon.expoideas.evaluations.EvaluatorRule;
import co.edu.unisimon.expoideas.projects.Project;
import co.edu.unisimon.expoideas.users.User;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Califican un proyecto los jurados que la gestión le asignó. */
@Component
@RequiredArgsConstructor
class JuryEvaluatorRule implements EvaluatorRule {

    private final JuryAssignmentRepository assignmentRepository;

    @Override
    @Transactional(readOnly = true)
    public boolean isEvaluator(Project project, User user) {
        return assignmentRepository.existsByProjectIdAndUserId(project.getId(), user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> evaluatorsOf(Project project) {
        return assignmentRepository.findByProjectIdOrderByCreatedAtAsc(project.getId()).stream()
                .map(JuryAssignment::getUser)
                .toList();
    }
}
