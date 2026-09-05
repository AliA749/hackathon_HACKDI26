package org.hackdi.localnj.common;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Turns Jakarta Validation failures into a small JSON body the frontend can
 * show directly, instead of Spring's default stack-trace-shaped error page.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {
		Map<String, String> fieldErrors = new LinkedHashMap<>();
		exception.getBindingResult().getFieldErrors()
			.forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("message", "Please fix the highlighted fields.");
		body.put("errors", fieldErrors);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
	}
}
