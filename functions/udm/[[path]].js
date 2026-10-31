import { proxy } from '../_proxy.js';

// Handles /udm/*  -> ${PORTAL_ORIGIN}/*
export const onRequest = (context) => proxy(context);
