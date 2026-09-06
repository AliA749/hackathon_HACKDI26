import { useEffect, useState } from "react";
import { CATEGORIES, categoryMeta } from "../constants/categories.js";

const EMPTY_FORM = { ownerName: "", businessName: "", category: "BARBER", websiteUrl: "", comment: "" };

const FIELD_CLASS =
	"w-full rounded-xl bg-surface-container-low px-3 py-2.5 font-body-base text-body-base text-on-surface placeholder:text-outline border border-transparent focus:border-primary/40 focus:bg-surface-container-lowest focus:outline-none transition-colors";

const LABEL_CLASS = "font-label-lg text-label-lg text-on-surface";

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

	// Escape closes the composer; a modal that can only be dismissed by hunting
	// for the X is a small cruelty.
	useEffect(() => {
		if (!open) {
			return;
		}
		function onKeyDown(event) {
			if (event.key === "Escape") {
				onClose();
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [open, onClose]);

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

	const meta = categoryMeta(form.category);

	return (
		<>
			<div
				className="fixed inset-0 z-[1100] bg-inverse-surface/20 backdrop-blur-[2px]"
				onClick={onClose}
				aria-hidden="true"
			/>

			<aside
				className="fixed z-[1200] top-4 right-4 bottom-4 w-[min(400px,calc(100vw-2rem))] bg-surface-container-lowest rounded-2xl shadow-[0_24px_60px_rgba(13,92,70,0.28)] flex flex-col overflow-hidden"
				aria-label="Add a business listing"
				role="dialog"
				aria-modal="true"
			>
				<div className="flex items-start justify-between gap-3 p-4 border-b border-surface-container-high/60 flex-shrink-0">
					<div className="flex items-center gap-2.5 min-w-0">
						<span
							className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
							style={{ background: meta.ink, color: meta.on }}
						>
							<span className="material-symbols-outlined text-[20px]" aria-hidden="true">{meta.icon}</span>
						</span>
						<div className="min-w-0">
							<h2 className="font-headline-sm text-headline-sm text-on-surface">Add a business</h2>
							<p className="font-body-sm text-body-sm text-on-surface-variant truncate">
								{position.lat.toFixed(5)}, {position.lng.toFixed(5)}
							</p>
						</div>
					</div>

					<button
						className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors flex-shrink-0"
						type="button"
						onClick={onClose}
						aria-label="Close form"
					>
						<span className="material-symbols-outlined text-[18px]">close</span>
					</button>
				</div>

				<form className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-none" onSubmit={handleSubmit}>
					<label className="grid gap-1.5">
						<span className={LABEL_CLASS}>Your name</span>
						<input
							className={FIELD_CLASS}
							value={form.ownerName}
							onChange={update("ownerName")}
							maxLength={80}
							required
							autoComplete="name"
							placeholder="Amina Rahman"
						/>
					</label>

					<label className="grid gap-1.5">
						<span className={LABEL_CLASS}>Business name</span>
						<input
							className={FIELD_CLASS}
							value={form.businessName}
							onChange={update("businessName")}
							maxLength={100}
							required
							placeholder="Halal Meal Prep NJ"
						/>
					</label>

					<div className="grid gap-1.5">
						<span className={LABEL_CLASS}>Category</span>
						<div className="flex flex-wrap gap-1.5">
							{CATEGORIES.map((category) => {
								const active = form.category === category.value;
								return (
									<button
										key={category.value}
										className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-colors ${
											active ? "text-white" : "bg-surface-container text-on-surface hover:bg-surface-container-high"
										}`}
										style={active ? { background: category.ink, color: category.on } : undefined}
										type="button"
										aria-pressed={active}
										onClick={() => setForm((current) => ({ ...current, category: category.value }))}
									>
										<span
											className="material-symbols-outlined text-[15px]"
											style={active ? undefined : { color: category.ink }}
											aria-hidden="true"
										>
											{category.icon}
										</span>
										{category.label}
									</button>
								);
							})}
						</div>
					</div>

					<label className="grid gap-1.5">
						<span className={LABEL_CLASS}>Website or booking link</span>
						<input
							className={FIELD_CLASS}
							value={form.websiteUrl}
							onChange={update("websiteUrl")}
							maxLength={255}
							inputMode="url"
							placeholder="https://your-site.com"
						/>
					</label>

					<label className="grid gap-1.5">
						<span className={LABEL_CLASS}>Description</span>
						<textarea
							className={`${FIELD_CLASS} min-h-[120px] resize-y`}
							value={form.comment}
							onChange={update("comment")}
							maxLength={500}
							required
							placeholder="What do you offer, where do you serve, and how should people reach you?"
						/>
					</label>

					{error && (
						<p
							className="px-3 py-2 rounded-xl bg-error-container text-on-error-container font-body-sm text-body-sm"
							role="status"
						>
							{error}
						</p>
					)}

					<button
						className="mt-1 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg shadow-[0_4px_12px_rgba(13,92,70,0.18)] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
						type="submit"
						disabled={submitting}
					>
						<span className="material-symbols-outlined text-[20px]" aria-hidden="true">
							{submitting ? "progress_activity" : "send"}
						</span>
						{submitting ? "Publishing..." : "Publish pin"}
					</button>
				</form>
			</aside>
		</>
	);
}
