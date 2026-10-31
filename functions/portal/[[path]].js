import { proxy } from '../_proxy.js';

// Handles /portal/*  -> ${PORTAL_ORIGIN}/*
export const onRequest = (context) => proxy(context);
