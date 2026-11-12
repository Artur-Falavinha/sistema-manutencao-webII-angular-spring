package com.remont.back_end.service;

import com.remont.back_end.repository.EmployeeRepository;
import com.remont.back_end.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doAnswer;

@SpringBootTest(properties = "spring.jpa.hibernate.ddl-auto=update")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class EmployeeRemovalConcurrencyTest {

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private JdbcTemplate jdbc;

    @MockitoSpyBean
    private EmployeeRepository employeeRepository;

    @Test
    void crossedRemovalsKeepAtLeastOneActiveEmployee() throws Exception {
        jdbc.update("update employees set active = (user_id in (2, 3))");
        UserPrincipal maria = new UserPrincipal(employeeRepository.findById(2L).orElseThrow());
        UserPrincipal mario = new UserPrincipal(employeeRepository.findById(3L).orElseThrow());
        CyclicBarrier countsRead = new CyclicBarrier(2);
        doAnswer(invocation -> {
            long count = jdbc.queryForObject("select count(*) from employees where active = true", Long.class);
            countsRead.await(10, TimeUnit.SECONDS);
            return count;
        }).when(employeeRepository).countByActiveTrue();

        var executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            var first = executor.submit(() -> remove(maria, 3L, ready, start));
            var second = executor.submit(() -> remove(mario, 2L, ready, start));
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            boolean firstSucceeded = first.get(20, TimeUnit.SECONDS);
            boolean secondSucceeded = second.get(20, TimeUnit.SECONDS);

            assertThat(jdbc.queryForObject("select count(*) from employees where active = true", Long.class))
                    .isEqualTo(1L);
            assertThat(firstSucceeded ^ secondSucceeded).isTrue();
        } finally {
            start.countDown();
            executor.shutdownNow();
            executor.awaitTermination(10, TimeUnit.SECONDS);
            jdbc.update("update employees set active = true");
        }
    }

    private boolean remove(UserPrincipal principal, Long target, CountDownLatch ready, CountDownLatch start) throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        ready.countDown();
        try {
            start.await(10, TimeUnit.SECONDS);
            employeeService.deleteEmployee(target);
            return true;
        } catch (IllegalStateException expectedConflict) {
            return false;
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
