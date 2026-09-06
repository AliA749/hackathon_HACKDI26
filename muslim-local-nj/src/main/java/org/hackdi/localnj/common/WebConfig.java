package org.hackdi.localnj.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Allows the React frontend (running on its own dev server / origin) to call
 * this API. The Vite dev server proxies /api requests already (see
 * frontend/vite.config.js), so this mainly matters for `vite preview`,
 * teammates opening the frontend on a different port, or a split deployment.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Value("${app.cors.allowed-origins:http://localhost:5173}")
	private String allowedOrigins;

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/api/**")
			.allowedOrigins(allowedOrigins.split(","))
			.allowedMethods("GET", "POST", "DELETE", "OPTIONS")
			.allowedHeaders("*");
	}
}
