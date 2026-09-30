package co.edu.unisimon.expoideas.evaluations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.edu.unisimon.expoideas.common.ForbiddenActionException;
import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import co.edu.unisimon.expoideas.editions.Track;
import co.edu.unisimon.expoideas.evaluations.EvaluationRequest.ScoreRequest;
import co.edu.unisimon.expoideas.projects.Project;
import co.edu.unisimon.expoideas.projects.ProjectPolicy;
import co.edu.unisimon.expoideas.support.TestData;
import co.edu.unisimon.expoideas.users.Role;
import co.edu.unisimon.expoideas.users.User;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Quién califica, qué se le exige a una evaluación y cómo sale la nota. */
@ExtendWith(MockitoExtension.class)
class EvaluationServiceTest {

    private static final int PROJECT = 10;

    @Mock
    private RubricRepository rubricRepository;

    @Mock
    private EvaluationRepository evaluationRepository;

    @Mock
    private ProjectPolicy policy;

    @Mock
    private EvaluatorRule evaluatorRule;

    private EvaluationService service;
    private Project project;
    private Rubric rubric;

    private final User marta = TestData.user(8, "marta@empresa.com", Role.JUDGE);
    private final User pedro = TestData.user(9, "pedro@unisimon.edu.co", Role.TEACHER);
    private final User carlos = TestData.user(2, "carlos@unisimon.edu.co", Role.TEACHER);
    private final User coordination = TestData.user(1, "coordinacion@unisimon.edu.co", Role.MACONDOLAB);
    private final User ana = TestData.user(3, "ana@unisimon.edu.co", Role.STUDENT);

    @BeforeEach
    void setUp() {
        service = new EvaluationService(rubricRepository, evaluationRepository, policy, evaluatorRule);
        project = mock(Project.class);
        lenient().when(project.getId()).thenReturn(PROJECT);
        lenient().when(project.getTrack()).thenReturn(Track.INNPRENDE_I);
        lenient().when(project.getTeacher()).thenReturn(carlos);
        // Dos criterios: el primero con niveles 0.0 / 3.0 / 4.0 (ids 11-13); el segundo, 1.5 / 4.5 / 5.0 (ids 21-23).
        rubric = rubric(criterion(1, "0.0", "3.0", "4.0"), criterion(2, "1.5", "4.5", "5.0"));
        lenient().when(rubricRepository.findByTrack(Track.INNPRENDE_I)).thenReturn(Optional.of(rubric));
        lenient().when(evaluationRepository.save(any())).thenAnswer(call -> call.getArgument(0));
        for (User user : List.of(marta, pedro, carlos, coordination, ana)) {
            lenient().when(policy.account(user.getEmail())).thenReturn(user);
            lenient().when(policy.findVisible(PROJECT, user)).thenReturn(project);
        }
        lenient().when(evaluatorRule.isEvaluator(project, marta)).thenReturn(true);
        lenient().when(evaluatorRule.isEvaluator(project, pedro)).thenReturn(true);
    }

    @Test
    void onlyAnAssignedJurorEvaluates() {
        // El profesor del grupo ve el proyecto, pero no lo califica.
        assertThatThrownBy(() -> service.save(PROJECT, carlos.getEmail(), scores(score(1, 13), score(2, 23))))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("jurados asignados");
        assertThatThrownBy(() -> service.mine(PROJECT, carlos.getEmail())).isInstanceOf(ForbiddenActionException.class);
        verify(evaluationRepository, never()).save(any());
    }

    @Test
    void theGradeIsTheSimpleAverageOfTheCriteria() {
        EvaluationResponse saved = service.save(PROJECT, marta.getEmail(), scores(score(1, 13), score(2, 22)));

        // (4.0 + 4.5) / 2 = 4.25, que con un decimal sube a 4.3.
        assertThat(saved.grade()).isEqualByComparingTo("4.3");
        assertThat(saved.scale()).isEqualTo(GradeScale.GOOD);
        assertThat(saved.absent()).isFalse();
        assertThat(saved.juror()).isEqualTo(marta.fullName());
        assertThat(saved.scores())
                .extracting(EvaluationResponse.ScoreResponse::levelId)
                .containsExactly(13, 22);
    }

    @Test
    void everyCriterionNeedsALevelOfItsOwn() {
        // Falta el segundo criterio.
        assertThatThrownBy(() -> service.save(PROJECT, marta.getEmail(), scores(score(1, 13))))
                .isInstanceOfSatisfying(
                        InvalidFieldsException.class,
                        error -> assertThat(error.getFields()).containsOnlyKeys("scores.2.levelId"));
        // El nivel 23 es del segundo criterio, no del primero.
        assertThatThrownBy(() -> service.save(PROJECT, marta.getEmail(), scores(score(1, 23), score(2, 23))))
                .isInstanceOfSatisfying(
                        InvalidFieldsException.class,
                        error -> assertThat(error.getFields()).containsOnlyKeys("scores.1.levelId"));
        // Un criterio que no es de esta rúbrica.
        assertThatThrownBy(
                        () -> service.save(PROJECT, marta.getEmail(), scores(score(1, 13), score(2, 23), score(7, 71))))
                .isInstanceOfSatisfying(
                        InvalidFieldsException.class,
                        error -> assertThat(error.getFields()).containsOnlyKeys("scores"));
        verify(evaluationRepository, never()).save(any());
    }

    @Test
    void theCommentIsOptionalWhenPassingAndRequiredBelowThree() {
        // 3.0 aprueba: sin observación. 1.5 no: la pide, y una en blanco no cuenta.
        assertThatThrownBy(() ->
                        service.save(PROJECT, marta.getEmail(), scores(score(1, 12), new ScoreRequest(2, 21, "   "))))
                .isInstanceOfSatisfying(
                        InvalidFieldsException.class,
                        error -> assertThat(error.getFields()).containsOnlyKeys("scores.2.comment"));

        EvaluationResponse saved = service.save(
                PROJECT,
                marta.getEmail(),
                scores(score(1, 12), new ScoreRequest(2, 21, "  No se entendió el modelo de negocio.  ")));

        assertThat(saved.grade()).isEqualByComparingTo("2.3");
        assertThat(saved.scale()).isEqualTo(GradeScale.FAILING);
        assertThat(saved.scores().get(0).comment()).isNull();
        assertThat(saved.scores().get(1).comment()).isEqualTo("No se entendió el modelo de negocio.");
    }

    @Test
    void ifTheTeamDidNotShowUpTheEvaluationIsZeroWithoutLevels() {
        Evaluation existing = Evaluation.of(project, marta);
        existing.score(rubric.getCriteria().get(0), level(rubric, 13), null);
        existing.score(rubric.getCriteria().get(1), level(rubric, 23), null);
        when(evaluationRepository.findByProjectIdAndJurorId(PROJECT, 8)).thenReturn(Optional.of(existing));

        EvaluationResponse saved = service.save(PROJECT, marta.getEmail(), new EvaluationRequest(true, null));

        assertThat(saved.absent()).isTrue();
        assertThat(saved.grade()).isEqualByComparingTo("0.0");
        assertThat(saved.scale()).isEqualTo(GradeScale.FAILING);
        assertThat(saved.scores()).isEmpty();
    }

    @Test
    void correctingChangesTheSameRowsInsteadOfAddingMore() {
        Evaluation existing = Evaluation.of(project, marta);
        existing.markAbsent();
        when(evaluationRepository.findByProjectIdAndJurorId(PROJECT, 8)).thenReturn(Optional.of(existing));

        service.save(PROJECT, marta.getEmail(), scores(score(1, 12), score(2, 22)));
        EvaluationResponse corrected = service.save(PROJECT, marta.getEmail(), scores(score(1, 13), score(2, 23)));

        assertThat(existing.getScores()).hasSize(2);
        assertThat(corrected.absent()).isFalse();
        assertThat(corrected.grade()).isEqualByComparingTo("4.5");
    }

    @Test
    void theProjectGradeAveragesTheJurorsWhoAreStillAssigned() {
        User removed = TestData.user(12, "otro@empresa.com", Role.JUDGE);
        when(evaluatorRule.evaluatorsOf(project)).thenReturn(List.of(marta, pedro));
        when(evaluationRepository.findByProjectIdOrderByCreatedAtAsc(PROJECT))
                .thenReturn(List.of(evaluation(marta, 13, 23), evaluation(removed, 11, 21)));

        ProjectEvaluationsResponse results = service.results(PROJECT, carlos.getEmail());

        // Solo cuenta Marta (4.5): a Pedro le falta y el tercero ya no es jurado.
        assertThat(results.grade()).isEqualByComparingTo("4.5");
        assertThat(results.scale()).isEqualTo(GradeScale.VERY_GOOD);
        assertThat(results.jurors()).isEqualTo(2);
        assertThat(results.evaluations())
                .extracting(EvaluationResponse::jurorId)
                .containsExactly(8);
        assertThat(results.pending())
                .extracting(ProjectEvaluationsResponse.PendingJuror::userId)
                .containsExactly(9);

        when(evaluationRepository.findByProjectIdOrderByCreatedAtAsc(PROJECT))
                .thenReturn(List.of(evaluation(marta, 13, 23), evaluation(pedro, 12, 22)));
        // Marta 4.5 y Pedro 3.8 (3.75): (4.5 + 3.8) / 2 = 4.15, que sube a 4.2.
        assertThat(service.results(PROJECT, coordination.getEmail()).grade()).isEqualByComparingTo("4.2");
    }

    @Test
    void withoutEvaluationsThereIsNoGradeYet() {
        when(evaluatorRule.evaluatorsOf(project)).thenReturn(List.of(marta));
        when(evaluationRepository.findByProjectIdOrderByCreatedAtAsc(PROJECT)).thenReturn(List.of());

        ProjectEvaluationsResponse results = service.results(PROJECT, coordination.getEmail());

        assertThat(results.grade()).isNull();
        assertThat(results.scale()).isNull();
        assertThat(results.pending()).hasSize(1);
    }

    @Test
    void gradesAreForTheGroupTeacherAndManagement() {
        assertThatThrownBy(() -> service.results(PROJECT, ana.getEmail()))
                .isInstanceOf(ForbiddenActionException.class)
                .hasMessageContaining("profesor del grupo o la gestión");
        // Un jurado ve la suya, no la de los demás.
        assertThatThrownBy(() -> service.results(PROJECT, marta.getEmail()))
                .isInstanceOf(ForbiddenActionException.class);
    }

    // ── Datos de apoyo ──────────────────────────────────────────────────────

    /** Un criterio con id {@code number} y niveles con ids {@code number}1, {@code number}2... */
    private static RubricCriterion criterion(int number, String... scores) {
        RubricCriterion criterion = new RubricCriterion();
        criterion.setId(number);
        criterion.setPosition(number);
        criterion.setName("Criterio " + number);
        criterion.setShortName("C" + number);
        for (int index = 0; index < scores.length; index++) {
            RubricLevel level = new RubricLevel();
            level.setId(number * 10 + index + 1);
            level.setCriterion(criterion);
            level.setPosition(index + 1);
            level.setLabel("Nivel " + (index + 1));
            level.setScore(new BigDecimal(scores[index]));
            level.setDescription("Descripción");
            criterion.getLevels().add(level);
        }
        return criterion;
    }

    private static Rubric rubric(RubricCriterion... criteria) {
        Rubric rubric = new Rubric();
        rubric.setId(1);
        rubric.setTrack(Track.INNPRENDE_I);
        rubric.setName("Póster");
        rubric.getCriteria().addAll(List.of(criteria));
        return rubric;
    }

    private static RubricLevel level(Rubric rubric, int levelId) {
        return rubric.getCriteria().stream()
                .flatMap(criterion -> criterion.getLevels().stream())
                .filter(level -> level.getId() == levelId)
                .findFirst()
                .orElseThrow();
    }

    private Evaluation evaluation(User juror, int firstLevel, int secondLevel) {
        Evaluation evaluation = Evaluation.of(project, juror);
        evaluation.score(rubric.getCriteria().get(0), level(rubric, firstLevel), "Observación");
        evaluation.score(rubric.getCriteria().get(1), level(rubric, secondLevel), "Observación");
        return evaluation;
    }

    private static ScoreRequest score(int criterionId, int levelId) {
        return new ScoreRequest(criterionId, levelId, null);
    }

    private static EvaluationRequest scores(ScoreRequest... scores) {
        return new EvaluationRequest(false, List.of(scores));
    }
}
