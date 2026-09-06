package org.hackdi.localnj.listing;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Enforces the shape difference between the two post kinds.
 *
 * <p>An EXPERIENCE must not carry a business name or a website. That is not
 * cosmetic tidiness: the composer never asks for either, so anything arriving
 * in those fields on an experience came from a hand-rolled request, and
 * accepting it would put an advertisement into the feed that the UI has no
 * intention of rendering.
 */
public class ValidPostValidator implements ConstraintValidator<ValidPost, BusinessListingRequest> {

	@Override
	public boolean isValid(BusinessListingRequest request, ConstraintValidatorContext context) {
		if (request == null) {
			// @NotNull on the field reports this; don't double-report it here.
			return true;
		}

		PostKind kind = request.kindOrDefault();
		context.disableDefaultConstraintViolation();

		if (kind == PostKind.EXPERIENCE) {
			boolean valid = true;
			if (hasText(request.businessName())) {
				reject(context, "businessName", "An experience post has no business name.");
				valid = false;
			}
			if (hasText(request.websiteUrl())) {
				reject(context, "websiteUrl", "An experience post has no website.");
				valid = false;
			}
			return valid;
		}

		if (!hasText(request.businessName())) {
			reject(context, "businessName", "Business name is required.");
			return false;
		}
		return true;
	}

	private void reject(ConstraintValidatorContext context, String field, String message) {
		context.buildConstraintViolationWithTemplate(message)
			.addPropertyNode(field)
			.addConstraintViolation();
	}

	private boolean hasText(String value) {
		return value != null && !value.isBlank();
	}
}
