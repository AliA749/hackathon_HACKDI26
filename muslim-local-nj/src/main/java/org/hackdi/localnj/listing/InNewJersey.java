package org.hackdi.localnj.listing;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Type-level constraint: the request's coordinates must fall inside the real
 * New Jersey outline, not merely inside a bounding box around it.
 */
@Documented
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = InNewJerseyValidator.class)
public @interface InNewJersey {

	String message() default "That location is outside New Jersey.";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
