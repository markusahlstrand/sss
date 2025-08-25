use anyhow::Result;
use opentelemetry::trace::TracerProvider;
use opentelemetry::KeyValue;
use opentelemetry_sdk::{
    trace::{self, Sampler},
    Resource,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

pub fn init() -> Result<()> {
    // Initialize OpenTelemetry
    let tracer_provider = trace::TracerProvider::builder()
        .with_config(
            trace::Config::default()
                .with_sampler(Sampler::AlwaysOn)
                .with_resource(Resource::new(vec![
                    KeyValue::new("service.name", "orders"),
                    KeyValue::new("service.version", "1.0.0"),
                ]))
        )
        .build();

    opentelemetry::global::set_tracer_provider(tracer_provider.clone());

    // Initialize tracing subscriber with structured JSON logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::fmt::layer()
                .json()
                .with_current_span(true)
                .with_span_list(false)
        )
        .with(tracing_opentelemetry::layer().with_tracer(
            tracer_provider.tracer("orders")
        ))
        .with(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into())
        )
        .init();

    Ok(())
}
