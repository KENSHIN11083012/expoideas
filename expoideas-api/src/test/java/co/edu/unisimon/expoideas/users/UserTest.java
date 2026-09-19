package co.edu.unisimon.expoideas.users;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static co.edu.unisimon.expoideas.users.OnboardingStep.CHANGE_PASSWORD;
import static co.edu.unisimon.expoideas.users.OnboardingStep.DATA_CONSENT;
import static org.assertj.core.api.Assertions.assertThat;

class UserTest {

    @Test
    void registeredAccountWithConsentHasNoPendingSteps() {
        assertThat(User.builder().dataConsent(true).build().pendingSteps()).isEmpty();
    }

    @Test
    void accountCreatedByManagementAsksForPasswordThenConsent() {
        User user = User.builder().mustChangePassword(true).dataConsent(false).build();

        assertThat(user.pendingSteps()).containsExactly(CHANGE_PASSWORD, DATA_CONSENT);
    }

    @Test
    void resetPasswordOnlyAsksToChangeIt() {
        User user = User.builder().mustChangePassword(true).dataConsent(true).build();

        assertThat(user.pendingSteps()).containsExactly(CHANGE_PASSWORD);
    }

    @Test
    void withoutRecordedConsentItAsksForIt() {
        assertThat(User.builder().build().pendingSteps()).containsExactly(DATA_CONSENT);
    }

    @Test
    void consentKeepsTheOriginalDate() {
        User user = User.builder().build();

        user.giveDataConsent();
        LocalDateTime first = user.getDataConsentAt();
        user.giveDataConsent();

        assertThat(user.isDataConsent()).isTrue();
        assertThat(first).isNotNull();
        assertThat(user.getDataConsentAt()).isSameAs(first);
    }
}
