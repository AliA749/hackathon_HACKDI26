package org.hackdi.localnj.listing;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.hackdi.localnj.geo.NewJerseyBoundary;

public class InNewJerseyValidator implements ConstraintValidator<InNewJersey, BusinessListingRequest> {

	private final NewJerseyBoundary boundary;

	public InNewJerseyValidator(NewJerseyBoundary boundary) {
		this.boundary = boundary;
	}

	@Override
	public boolean isValid(BusinessListingRequest request, ConstraintValidatorContext context) {
		if (request == null || request.latitude() == null || request.longitude() == null) {
			// @NotNull on the fields reports those separately.
			return true;
		}

		if (boundary.contains(request.latitude(), request.longitude())) {
			return true;
		}

		// Report against a field rather than the whole object so it lands in
		// the same field-error map the frontend already renders.
		context.disableDefaultConstraintViolation();
		context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
			.addPropertyNode("latitude")
			.addConstraintViolation();
		return false;
	}
}
