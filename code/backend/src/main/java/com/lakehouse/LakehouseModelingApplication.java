package com.lakehouse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 湖仓建模工具主应用类
 * 
 * @author Lakehouse Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class LakehouseModelingApplication {

    public static void main(String[] args) {
        SpringApplication.run(LakehouseModelingApplication.class, args);
    }
}

