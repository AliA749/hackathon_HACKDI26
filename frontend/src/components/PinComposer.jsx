import { useEffect, useState } from "react";
import { CATEGORIES } from "../constants/categories.js";

const EMPTY_FORM = { ownerName: "", businessName: "", category: "BARBER", websiteUrl: "", comment: "" };

export default function PinComposer({ open, position, onClose, onSubmit }) {
	const [form, setForm] = useState(EMPTY_FORM);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (open) {
			setForm(EMPTY_FORM);
			setError("");
		}
	}, [open, position]);

	if (!open || !position) {
		return null;
	}

	function update(field) {
		return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setSubmitting(true);
		try {
			await onSubmit({
				...form,
				latitude: position.lat,
				longitude: position.lng
			});
		}
		catch (submitError) {
			setError(submitError.message);
		}
		finally {
			setSubmitting(false);
		}
	}

	return (
		<aside className="composer open" aria-label="Add a business listing">
			<div className="composer-header">
				<div>
					<h2>Add a business pin</h2>
					<p>{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>
				</div>
				<button className="icon-button" type="button" onClick={onClose} aria-label="Close form">
					&times;
				</button>
			</div>

			<form onSubmit={handleSubmit}>
				<label>
					<span>Your name</span>
					<input value={form.ownerName} onChange={update("ownerName")} maxLength={80} required autoComplete="name" />
				</label>

				<label>
					<span>Business name</span>
					<input value={form.businessName} onChange={update("businessName")} maxLength={100} required />
				</label>

				<label>
					<span>Category</span>
					<select value={form.category} onChange={update("category")} required>
						{CATEGORIES.map((option) => (
							<option key={option.value} value={option.value}>{option.label}</option>
						))}
					</select>
				</label>

				<label>
					<span>Website or booking link</span>
					<input
						value={form.websiteUrl}
						onChange={update("websiteUrl")}
						maxLength={255}
						inputMode="url"
						placeholder="https://your-site.com"
					/>
				</label>

				<label>
					<span>Description</span>
					<textarea
						value={form.comment}
						onChange={update("comment")}
						maxLength={500}
						required
						placeholder="What do you offer, where do you serve, and how should people reach you?"
					/>
				</label>

				{error && <p className="form-message" role="status">{error}</p>}

				<button className="primary-button submit-button" type="submit" disabled={submitting}>
					{submitting ? "Publishing..." : "Publish pin"}
				</button>
			</form>
		</aside>
	);
}
