package org.hackdi.localnj.listing;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Class-level because the rules depend on more than one field at once: whether
 * a business name is required is a question about the post's kind, which a
 * field annotation on {@code businessName} cannot see.
 */
@Documented
@Constraint(validatedBy = ValidPostValidator.class)
@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPost {

	String message() default "This post is not valid for its kind.";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
