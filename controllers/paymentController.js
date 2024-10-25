// controllers/paymentController.js

const Stripe = require('stripe');
const stripe = Stripe('sk_test_51Q9a2gRqSLao4U6Dr8D74mPGjFTUVrDGAWvW8czJNpNLGZnGA4SpDOCTpH8Wl7fsFFS906XaxkUQv3RRiIRacbyp00G9V7zjUC');  // Asegúrate de usar la clave secreta de Stripe

exports.createPayment = async (req, res) => {
    const { payment_method_id, costo_total, id_usuario } = req.body;

    try {
        // Crear un PaymentIntent en Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: costo_total,
            currency: 'usd',
            payment_method: payment_method_id,
            confirm: true,
            return_url: 'http://localhost:3000/confirmacion-pago',  // URL de redirección después del pago
        });

        res.json({ success: true, message: 'Pago procesado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};

