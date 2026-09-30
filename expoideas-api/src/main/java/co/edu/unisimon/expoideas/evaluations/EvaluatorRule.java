package co.edu.unisimon.expoideas.evaluations;

import co.edu.unisimon.expoideas.projects.Project;
import co.edu.unisimon.expoideas.users.User;
import java.util.List;

/**
 * Quién califica un proyecto. La evaluación no sabe cómo se asignan los
 * jurados: lo responde el módulo de jurados, que implementa este contrato.
 */
public interface EvaluatorRule {

    boolean isEvaluator(Project project, User user);

    /** Las personas que califican ese proyecto, en el orden en que se asignaron. */
    List<User> evaluatorsOf(Project project);
}
